'use client'

import React, { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { MapPin, Star, Download } from 'lucide-react'
import { loadSites, EnrichedSite, scoreTierClass } from '@/lib/sites'
import { bankPackCsv, bankPackMarkdown, bankPackTsv } from '@/lib/bank-pack'
import { downloadBlob } from '@/lib/export-formats'
import ScoreLegend from '@/components/ScoreLegend'

export default function AllSitesExplorer() {
  const [allSites, setAllSites] = useState<EnrichedSite[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [provinceFilter, setProvinceFilter] = useState('')
  const [view, setView] = useState<'table' | 'cards'>('cards')
  const [selected, setSelected] = useState<EnrichedSite | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set()) // bulk actions for item 12

  useEffect(() => {
    loadSites().then(s => {
      setAllSites(s)
      setLoading(false)
    })
  }, [])

  const filtered = useMemo(() => {
    let res = allSites
    const q = search.toLowerCase().trim()
    if (q) {
      res = res.filter(s => {
        const p = s.properties
        return [p.name, p.province, p.city, p.company, s.id].some(v => String(v || '').toLowerCase().includes(q))
      })
    }
    if (provinceFilter) res = res.filter(s => s.properties.province === provinceFilter)
    return res.sort((a, b) => b.strandedScore - a.strandedScore)
  }, [allSites, search, provinceFilter])

  const provinces = useMemo(() => Array.from(new Set(allSites.map(s => s.properties.province))).filter(Boolean).sort(), [allSites])

  const exportFiltered = () => {
    const blob = new Blob([JSON.stringify(filtered.map(s => ({...s.properties, strandedScore: s.strandedScore, id: s.id})), null, 2)], {type: 'application/json'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `stranded-sites-${filtered.length}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const selectedSites = useMemo(
    () => allSites.filter(s => selectedIds.has(s.id)),
    [allSites, selectedIds]
  )

  const exportBankPack = (fmt: 'csv' | 'md' | 'tsv') => {
    const sites = selectedSites.length ? selectedSites : filtered.slice(0, 50)
    if (fmt === 'csv') downloadBlob(bankPackCsv(sites), `stranded-bank-${sites.length}.csv`, 'text/csv')
    else if (fmt === 'tsv') downloadBlob(bankPackTsv(sites), `stranded-bank-${sites.length}.tsv`, 'text/tab-separated-values')
    else downloadBlob(bankPackMarkdown(sites, allSites, { title: selectedSites.length ? 'Selection Bank Pack' : 'Filtered Bank Pack' }), `stranded-bank-${sites.length}.md`, 'text/markdown')
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-9">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tighter">All Sites</h1>
          <p className="text-gray-400 mt-1">Every one of the 2,611. Sorted by Stranded Score by default. Click anything.</p>
        </div>
        <div className="flex flex-wrap gap-2 justify-end">
          <button onClick={() => setView(v => v === 'cards' ? 'table' : 'cards')} className="text-sm px-4 py-2 rounded-2xl border border-white/15 hover:bg-white/5">
            {view === 'cards' ? 'TABLE VIEW' : 'CARDS VIEW'}
          </button>
          <button onClick={exportFiltered} className="flex items-center gap-2 text-sm px-4 py-2 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10">
            <Download size={16} /> JSON
          </button>
          <button onClick={() => exportBankPack('csv')} className="text-sm px-3 py-2 rounded-2xl border border-[#FF8C00]/40 text-[#FF8C00] hover:bg-[#FF8C00]/10" title={selectedSites.length ? `Bank pack ${selectedSites.length} selected` : 'Bank pack top 50 filtered'}>
            Bank CSV
          </button>
          <button onClick={() => exportBankPack('tsv')} className="text-sm px-3 py-2 rounded-2xl border border-white/15 hover:bg-white/5">TSV</button>
          <button onClick={() => exportBankPack('md')} className="text-sm px-3 py-2 rounded-2xl border border-white/15 hover:bg-white/5">MD brief</button>
          <Link href="/map" className="px-6 py-2 rounded-2xl bg-[#FF8C00] text-black font-semibold text-sm flex items-center">OPEN IN COMMAND CENTER →</Link>
        </div>
      </div>

      <div className="mb-4 max-w-md">
        <ScoreLegend />
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 sticky top-14 z-20 bg-[var(--bg-dark)] py-3 -mx-1 px-1">
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, province, company..." className="flex-1 glass border border-white/10 rounded-2xl px-5 py-3 text-sm" />
        <select value={provinceFilter} onChange={e=>setProvinceFilter(e.target.value)} className="glass border border-white/10 rounded-2xl px-5 text-sm min-w-[210px]">
          <option value="">All Provinces</option>
          {provinces.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <div className="self-center text-xs px-4 text-gray-400 tabular-nums">
          {filtered.length} / {allSites.length}
          {selectedSites.length > 0 && <span className="text-[#FF8C00]"> · {selectedSites.length} selected</span>}
        </div>
      </div>

      {loading && <div className="text-center py-20 text-gray-400">Loading full enriched dataset…</div>}

      {/* CARDS — wild beautiful mode */}
      {view === 'cards' && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.slice(0, 240).map(site => {
            const p = site.properties
            return (
              <motion.div 
                key={site.id}
                whileHover={{ scale: 1.005 }}
                onClick={() => setSelected(site)}
                className="site-card glass rounded-3xl p-6 cursor-pointer border border-white/10 flex flex-col"
              >
                <div className="flex justify-between items-start">
                  <div className="font-semibold leading-tight pr-4">{p.name || 'Unnamed emission point'}</div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={selectedIds.has(site.id)} onChange={(e) => {
                      e.stopPropagation()
                      const next = new Set(selectedIds)
                      if (next.has(site.id)) next.delete(site.id)
                      else next.add(site.id)
                      setSelectedIds(next)
                    }} onClick={e => e.stopPropagation()} className="accent-[#FF8C00]" />
                    <div className="ml-auto text-right">
                      <div className={`stranded-score ${scoreTierClass(site.strandedScore)}`}>
                        {site.strandedScore}
                      </div>
                      {site.scoreBadge && <div className="text-[9px] text-[#5BC0BE] mt-0.5">{site.scoreBadge}</div>}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-400 mt-1 mb-4">{p.province} • {p.city || 'remote'} • {p.source_type}</div>

                <div className="mt-auto flex items-baseline justify-between">
                  <div>
                    <div className="text-3xl font-semibold text-[#FF8C00] tabular-nums">{site.emission.toLocaleString()}</div>
                    <div className="text-[10px] -mt-1 text-gray-400">kg CH₄ / day</div>
                    <div className="text-[10px] text-gray-400">Generator: {site.maxGeneratorPowerKW || 'N/A'} kW (rec: {site.recommendedGenset || 'N/A'})</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-[#5BC0BE]">Potential daily</div>
                    <div className="font-mono text-lg">C${site.potentialDailyProfitCAD.toLocaleString()}</div>
                  </div>
                </div>

                <div className="mt-4 text-[10px] flex gap-2">
                  <Link href={`/map?site=${site.id}`} className="flex-1 text-center py-2 rounded-2xl border border-[#5BC0BE]/40 hover:bg-[#5BC0BE]/10">FLY TO MAP</Link>
                  <button onClick={(e) => { e.stopPropagation(); /* would trigger global portfolio but simplified */ window.location.href = `/map?site=${site.id}` }} className="flex-1 text-center py-2 rounded-2xl bg-white/5 hover:bg-white/10">DETAILS</button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* TABLE (still great) */}
      {view === 'table' && !loading && (
        <div className="border border-white/10 rounded-3xl overflow-hidden bg-[#0f172a]/70">
          <table className="w-full text-sm">
            <thead className="bg-[var(--bg-dark)] text-gray-400 sticky top-0">
              <tr>
                <th className="p-4 text-left font-normal">Name</th>
                <th className="p-4 text-left font-normal">Province</th>
                <th className="p-4 text-right font-normal">Emission</th>
                <th className="p-4 text-right font-normal">Generator kW</th>
                <th className="p-4 text-right font-normal">Score</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.slice(0, 600).map(site => (
                <tr key={site.id} className="hover:bg-white/5 cursor-pointer" onClick={() => setSelected(site)}>
                  <td className="p-4 font-medium">{site.properties.name}</td>
                  <td className="p-4 text-[#5BC0BE]">{site.properties.province}</td>
                  <td className="p-4 text-right font-mono text-[#FF8C00]">{site.emission.toLocaleString()}</td>
                  <td className="p-4 text-right font-mono">{site.maxGeneratorPowerKW || 'N/A'} kW</td>
                  <td className="p-4 text-right"><span className={`stranded-score ${scoreTierClass(site.strandedScore)}`}>{site.strandedScore}</span></td>
                  <td className="p-4 text-right">
                    <Link href={`/map?site=${site.id}`} className="text-xs px-4 py-1 border border-white/20 rounded-2xl hover:bg-white/5">MAP</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Sexy full properties modal */}
      {selected && (
        <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-6" onClick={() => setSelected(null)}>
          <div className="glass-strong max-w-2xl w-full rounded-3xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-8">
              <div className="flex justify-between">
                <div>
                  <div className="text-2xl font-semibold">{selected.properties.name}</div>
                  <div className="text-gray-400">{selected.properties.province} • Score <span className="text-[#FF8C00] font-mono">{selected.strandedScore}</span></div>
                </div>
                <button onClick={() => setSelected(null)} className="text-4xl leading-none text-gray-400 hover:text-white">×</button>
              </div>

              <div className="my-6 grid grid-cols-2 gap-4 text-sm">
                {Object.entries(selected.properties).slice(0, 18).map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b border-white/10 pb-1">
                    <span className="text-gray-400">{k}</span>
                    <span className="font-mono text-right">{typeof v === 'number' ? v.toLocaleString() : String(v ?? '—')}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Link href={`/map?site=${selected.id}`} className="flex-1 text-center py-3 rounded-2xl bg-[#FF8C00] text-black font-semibold">OPEN IN COMMAND CENTER</Link>
                <button onClick={() => setSelected(null)} className="flex-1 text-center py-3 rounded-2xl border border-white/20">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <p className="text-center text-[11px] text-gray-500 mt-8">All data 100% from source geojson. Stranded Score is a computed signal for capture attractiveness.</p>
    </div>
  )
}
