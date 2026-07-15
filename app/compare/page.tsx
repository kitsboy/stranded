'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Breadcrumbs from '@/components/Breadcrumbs'
import { loadSites, EnrichedSite, scoreTierClass } from '@/lib/sites'
import { explainStrandedScore } from '@/lib/scoring'
import { findPeerSites, findSimilarByEmission } from '@/lib/peers'

type CompareSlot = 'a' | 'b' | 'c'

function CompareContent() {
  const searchParams = useSearchParams()
  const idA = searchParams.get('a') || ''
  const idB = searchParams.get('b') || ''
  const idC = searchParams.get('c') || ''
  const [sites, setSites] = useState<Record<CompareSlot, EnrichedSite | null>>({ a: null, b: null, c: null })
  const [allSites, setAllSites] = useState<EnrichedSite[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSites().then(all => {
      setAllSites(all)
      const find = (id: string) =>
        all.find(s => s.id === id || String(s.properties.ghgrp_id) === id) ?? null
      setSites({
        a: idA ? find(idA) : null,
        b: idB ? find(idB) : null,
        c: idC ? find(idC) : null,
      })
      setLoading(false)
    })
  }, [idA, idB, idC])

  const active: { slot: CompareSlot; site: EnrichedSite }[] = (
    [['a', sites.a], ['b', sites.b], ['c', sites.c]] as const
  )
    .filter((entry): entry is [CompareSlot, EnrichedSite] => entry[1] != null)
    .map(([slot, site]) => ({ slot, site }))

  const metricRows: { label: string; values: Record<CompareSlot, string> }[] = []
  if (active.length >= 2) {
    const fields: { label: string; pick: (s: EnrichedSite) => string }[] = [
      { label: 'Stranded Score', pick: s => String(s.strandedScore) },
      { label: 'Emission (kg/day)', pick: s => s.emission.toLocaleString() },
      { label: 'Province', pick: s => s.properties.province || '—' },
      { label: 'Source type', pick: s => s.properties.source_type || '—' },
      { label: 'Confidence', pick: s => s.properties.confidence || '—' },
      { label: 'Genset', pick: s => s.recommendedGenset || '—' },
      { label: 'Generator kW', pick: s => String(s.maxGeneratorPowerKW) },
    ]
    for (const f of fields) {
      metricRows.push({
        label: f.label,
        values: {
          a: sites.a ? f.pick(sites.a) : '—',
          b: sites.b ? f.pick(sites.b) : '—',
          c: sites.c ? f.pick(sites.c) : '—',
        },
      })
    }
  }

  const slotColors: Record<CompareSlot, string> = { a: '#FF8C00', b: '#5BC0BE', c: '#A78BFA' }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Compare' }]} />
      <h1 className="text-4xl font-bold tracking-tighter mb-2">Site Compare</h1>
      <p className="text-gray-400 mb-8">
        Side-by-side scores via <code className="text-[#5BC0BE]">?a=</code>, <code className="text-[#5BC0BE]">?b=</code>, and optional <code className="text-[#5BC0BE]">?c=</code> site IDs.
      </p>

      {loading && <p className="text-gray-500">Loading dataset…</p>}

      {!loading && active.length < 2 && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-sm">
          <p>Provide at least two site IDs, e.g.{' '}
            <Link href="/compare?a=G10161&b=G12147" className="text-[#FF8C00] hover:underline">/compare?a=G10161&amp;b=G12147</Link>
            {' '}or three-way{' '}
            <Link href="/compare?a=G10161&b=G12147&c=G13001" className="text-[#5BC0BE] hover:underline">?a=&amp;b=&amp;c=</Link>
          </p>
        </div>
      )}

      {!loading && (idA || idB || idC) && active.length < 2 && (
        <p className="text-red-400 mt-4">Need at least two valid site IDs. Check IDs from the map panel or sites browser.</p>
      )}

      {active.length >= 2 && (
        <>
          <div className={`grid gap-4 mb-8 ${active.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
            {active.map(({ slot, site }) => (
              <div key={site.id} className="rounded-2xl border border-white/10 p-5 bg-white/[0.03]">
                <div className="text-xs mb-1" style={{ color: slotColors[slot] }}>Site {slot.toUpperCase()}</div>
                <h2 className="text-lg font-semibold truncate">{site.properties.name || site.id}</h2>
                <div className="mt-2 flex items-center gap-2">
                  <span className={`stranded-score ${scoreTierClass(site.strandedScore)}`}>{site.strandedScore}</span>
                  <span className="text-xs text-gray-400">{site.properties.province}</span>
                </div>
                <Link href={`/map?site=${site.id}`} className="text-xs text-[#5BC0BE] hover:underline mt-3 inline-block">Open on map →</Link>
              </div>
            ))}
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-gray-500">
                  <th className="p-4">Metric</th>
                  {active.map(({ slot, site }) => (
                    <th key={slot} className="p-4" style={{ color: slotColors[slot] }}>
                      {site.properties.name?.slice(0, 20) || slot.toUpperCase()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {metricRows.map(row => (
                  <tr key={row.label} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="p-4 text-gray-400">{row.label}</td>
                    {active.map(({ slot }) => (
                      <td key={slot} className="p-4 font-mono tabular-nums">{row.values[slot]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {active.length > 0 && allSites.length > 0 && (
            <div className="mt-8 rounded-2xl border border-white/10 p-5">
              <h3 className="font-semibold text-[#5BC0BE] mb-3">Peer site suggestions</h3>
              <div className={`grid gap-4 text-sm ${active.length >= 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
                {active.map(({ site }) => {
                  const peers = findPeerSites(site, allSites, 4)
                  const similar = findSimilarByEmission(site, allSites, 3)
                  return (
                    <div key={site.id} className="rounded-xl border border-white/10 p-4 bg-white/[0.02]">
                      <div className="text-xs text-gray-500 mb-2">{site.properties.name}</div>
                      <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Same province &amp; source</div>
                      <ul className="space-y-1 mb-3">
                        {peers.length ? peers.map(p => (
                          <li key={p.id} className="flex justify-between gap-2">
                            <Link href={`/compare?a=${site.id}&b=${p.id}`} className="text-[#5BC0BE] hover:underline truncate">{p.properties.name}</Link>
                            <span className="font-mono text-[#FF8C00] shrink-0">{p.strandedScore}</span>
                          </li>
                        )) : <li className="text-gray-500">No close peers</li>}
                      </ul>
                      <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Similar emission (±25%)</div>
                      <ul className="space-y-1">
                        {similar.map(p => (
                          <li key={p.id} className="flex justify-between gap-2">
                            <Link href={`/compare?a=${site.id}&b=${p.id}`} className="text-gray-300 hover:text-white truncate">{p.properties.name}</Link>
                            <span className="font-mono text-gray-400 shrink-0">{p.emission.toLocaleString()} kg</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <details className="mt-6 rounded-xl border border-white/10 p-4">
            <summary className="text-sm font-semibold text-[#FF8C00] cursor-pointer">Score factor breakdown</summary>
            <div className={`grid gap-4 mt-4 text-xs ${active.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
              {active.map(({ site }) => {
                const ex = explainStrandedScore(site)
                return (
                  <div key={site.id}>
                    <div className="font-medium mb-2">{site.properties.name}</div>
                    <ul className="space-y-1 text-gray-300">
                      {ex.factors.map(f => (
                        <li key={f.id} className="flex justify-between">
                          <span>{f.label}</span>
                          <span className="font-mono text-[#5BC0BE]">+{f.points}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
          </details>
        </>
      )}
    </div>
  )
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-gray-400">Loading compare…</div>}>
      <CompareContent />
    </Suspense>
  )
}