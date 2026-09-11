'use client'

import { useEffect, useMemo, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Breadcrumbs from '@/components/Breadcrumbs'
import { loadSites, EnrichedSite } from '@/lib/sites'
import type { LiveStats } from '@/types/live-stats'
import { recencyBreakdown, fluxBreakdown } from '@/lib/map-filters'

function fmtUsd(n: number) {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toLocaleString('en-CA')}`
}

function ProvincesContent() {
  const searchParams = useSearchParams()
  const selected = searchParams.get('name') || ''
  const [sites, setSites] = useState<EnrichedSite[]>([])
  const [stats, setStats] = useState<LiveStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSites().then(s => { setSites(s); setLoading(false) })
    fetch('/data/live-stats.json').then(r => r.json()).then(setStats).catch(() => {})
  }, [])

  const liveByProvince = useMemo(() => {
    const m = new Map<string, { emissionKgDay?: number; estRevenueUsd?: number }>()
    stats?.provinces?.forEach(p => {
      m.set(p.name, { emissionKgDay: p.emissionKgDay, estRevenueUsd: p.estRevenueUsd })
    })
    return m
  }, [stats])

  const hasLiveColumns = stats?.provinces?.some(p => p.emissionKgDay != null || p.estRevenueUsd != null)

  const provinces = useMemo(() => {
    const m: Record<string, EnrichedSite[]> = {}
    sites.forEach(s => {
      const p = s.properties.province || 'Unknown'
      if (!m[p]) m[p] = []
      m[p].push(s)
    })
    return Object.entries(m).map(([name, list]) => {
      const live = liveByProvince.get(name)
      const recency = recencyBreakdown(list)
      const flux = fluxBreakdown(list)
      return {
        name,
        count: list.length,
        totalEmission: list.reduce((a, x) => a + x.emission, 0),
        avgScore: +(list.reduce((a, x) => a + x.strandedScore, 0) / list.length).toFixed(1),
        emissionKgDay: live?.emissionKgDay,
        estRevenueUsd: live?.estRevenueUsd,
        filed2024: recency.y2024,
        filedBefore2023: recency.older,
        flaring: flux.flaring,
        top: [...list].sort((a, b) => b.strandedScore - a.strandedScore)[0],
      }
    }).sort((a, b) => b.count - a.count)
  }, [sites, liveByProvince])

  // Portfolio-wide honesty numbers — the split the old page buried.
  const datasetRecency = useMemo(() => recencyBreakdown(sites), [sites])
  const datasetFlux = useMemo(() => fluxBreakdown(sites), [sites])

  const filtered = selected ? sites.filter(s => s.properties.province === selected).sort((a, b) => b.strandedScore - a.strandedScore).slice(0, 20) : []

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Dashboard', href: '/dashboard' }, { label: selected || 'Provinces' }]} />
      <h1 className="text-4xl font-bold tracking-tighter mb-2">Provincial Intelligence</h1>
      <p className="text-gray-400 mb-3">{provinces.length} provinces &amp; territories · click for top sites</p>
      {!loading && sites.length > 0 && (
        <p className="text-xs text-gray-400 mb-8" data-testid="provinces-recency-split">
          Data recency: <span className="text-[#5BC0BE]">{datasetRecency.y2024.toLocaleString()}</span> sites filed for {datasetRecency.newestYear ?? '—'} ·{' '}
          <span className="text-white">{datasetRecency.y2023.toLocaleString()}</span> last filed in 2023 ·{' '}
          <span className="text-amber-200">{datasetRecency.older.toLocaleString()}</span> last filed before 2023 (historic figures, not current) ·{' '}
          <span className="text-[#FF8C00]">{datasetFlux.flaring.toLocaleString()}</span> report flaring (published for{' '}
          {datasetFlux.covered.toLocaleString()} of {sites.length.toLocaleString()} sites — no venting/flaring claim is made for the rest)
        </p>
      )}

      {loading ? <div className="text-gray-400">Loading…</div> : (
        <>
          {hasLiveColumns ? (
            <div className="overflow-x-auto rounded-2xl border border-white/10 mb-10" data-testid="provinces-table">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-xs uppercase text-gray-400">
                    <th className="p-3">Province</th>
                    <th className="p-3 text-right">Sites</th>
                    <th className="p-3 text-right">Filed 2024</th>
                    <th className="p-3 text-right">Pre-2023</th>
                    <th className="p-3 text-right" title="Sites whose ECCC source category publishes a venting/flaring split AND report CH₄ sent to flare">Flaring</th>
                    <th className="p-3 text-right">Emission kg/d</th>
                    <th className="p-3 text-right">Est. revenue</th>
                    <th className="p-3 text-right">Avg score</th>
                    <th className="p-3">Map</th>
                  </tr>
                </thead>
                <tbody>
                  {provinces.map(p => (
                    <tr key={p.name} className={`border-b border-white/5 hover:bg-white/[0.02] ${selected === p.name ? 'bg-[#FF8C00]/5' : ''}`}>
                      <td className="p-3">
                        <Link href={`/provinces?name=${encodeURIComponent(p.name)}`} className="font-medium hover:text-[#FF8C00]">
                          {p.name}
                        </Link>
                      </td>
                      <td className="p-3 text-right font-mono text-[#FF8C00]">{p.count}</td>
                      <td className="p-3 text-right font-mono text-[#5BC0BE]">{p.filed2024}</td>
                      <td className="p-3 text-right font-mono text-amber-200">{p.filedBefore2023}</td>
                      <td className="p-3 text-right font-mono text-[#FF8C00]">{p.flaring}</td>
                      <td className="p-3 text-right font-mono text-[#5BC0BE]">
                        {(p.emissionKgDay ?? p.totalEmission).toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-mono text-emerald-400">
                        {p.estRevenueUsd != null ? fmtUsd(p.estRevenueUsd) : '—'}
                      </td>
                      <td className="p-3 text-right font-mono">{p.avgScore}</td>
                      <td className="p-3">
                        <Link
                          href={`/map?province=${encodeURIComponent(p.name)}`}
                          className="text-xs text-[#5BC0BE] hover:underline"
                        >
                          Open map →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-4 mb-10">
              {provinces.map(p => (
                <div key={p.name} className={`rounded-2xl border p-5 transition hover:border-[#FF8C00]/50 ${selected === p.name ? 'border-[#FF8C00] bg-[#FF8C00]/5' : 'border-white/10 bg-white/[0.03]'}`}>
                  <Link href={`/provinces?name=${encodeURIComponent(p.name)}`} className="block">
                    <div className="font-semibold text-lg">{p.name}</div>
                    <div className="text-3xl font-bold text-[#FF8C00] mt-1">{p.count}</div>
                    <div className="text-xs text-gray-400 mt-2">{p.totalEmission.toLocaleString()} kg/day · avg score {p.avgScore}</div>
                    <div className="text-label text-gray-400 mt-1">
                      <span className="text-[#5BC0BE]">{p.filed2024}</span> filed 2024 ·{' '}
                      <span className="text-amber-200">{p.filedBefore2023}</span> pre-2023 ·{' '}
                      <span className="text-[#FF8C00]">{p.flaring}</span> report flaring
                    </div>
                  </Link>
                  <Link
                    href={`/map?province=${encodeURIComponent(p.name)}`}
                    className="text-xs text-[#5BC0BE] mt-2 inline-block hover:underline"
                  >
                    View on map →
                  </Link>
                </div>
              ))}
            </div>
          )}

          {selected && (
            <div>
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h2 className="text-xl font-semibold">Top sites in {selected}</h2>
                <div className="flex gap-2">
                  <Link
                    href={`/map?province=${encodeURIComponent(selected)}`}
                    className="text-xs px-3 py-1.5 rounded-lg border border-[#5BC0BE]/40 text-[#5BC0BE] hover:bg-[#5BC0BE]/10"
                  >
                    Open {selected} on map →
                  </Link>
                  <Link
                    href={`/print/province?province=${encodeURIComponent(selected)}`}
                    className="text-xs px-3 py-1.5 rounded-lg border border-[#FF8C00]/40 text-[#FF8C00] hover:bg-[#FF8C00]/10"
                  >
                    Print executive one-pager →
                  </Link>
                </div>
              </div>
              <div className="space-y-2">
                {filtered.map(s => (
                  <Link key={s.id} href={`/map?site=${s.id}`} className="flex justify-between items-center p-3 rounded-xl border border-white/10 hover:border-[#5BC0BE]/40 text-sm">
                    <span className="truncate">{s.properties.name}</span>
                    <span className="text-[#FF8C00] font-mono shrink-0 ml-2">{s.strandedScore} · {s.emission.toLocaleString()} kg/d</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function ProvincesPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-gray-400">Loading provinces…</div>}>
      <ProvincesContent />
    </Suspense>
  )
}