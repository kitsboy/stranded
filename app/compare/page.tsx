'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Breadcrumbs from '@/components/Breadcrumbs'
import { loadSites, EnrichedSite, scoreTierClass } from '@/lib/sites'
import { explainStrandedScore } from '@/lib/scoring'

function CompareContent() {
  const searchParams = useSearchParams()
  const idA = searchParams.get('a') || ''
  const idB = searchParams.get('b') || ''
  const [sites, setSites] = useState<{ a: EnrichedSite | null; b: EnrichedSite | null }>({ a: null, b: null })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSites().then(all => {
      const find = (id: string) =>
        all.find(s => s.id === id || String(s.properties.ghgrp_id) === id) ?? null
      setSites({ a: idA ? find(idA) : null, b: idB ? find(idB) : null })
      setLoading(false)
    })
  }, [idA, idB])

  const rows: { label: string; a: string; b: string }[] = []
  if (sites.a && sites.b) {
    const pa = sites.a.properties
    const pb = sites.b.properties
    rows.push(
      { label: 'Stranded Score', a: String(sites.a.strandedScore), b: String(sites.b.strandedScore) },
      { label: 'Emission (kg/day)', a: sites.a.emission.toLocaleString(), b: sites.b.emission.toLocaleString() },
      { label: 'Province', a: pa.province || '—', b: pb.province || '—' },
      { label: 'Source type', a: pa.source_type || '—', b: pb.source_type || '—' },
      { label: 'Confidence', a: pa.confidence || '—', b: pb.confidence || '—' },
      { label: 'Genset', a: sites.a.recommendedGenset || '—', b: sites.b.recommendedGenset || '—' },
      { label: 'Generator kW', a: String(sites.a.maxGeneratorPowerKW), b: String(sites.b.maxGeneratorPowerKW) },
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Compare' }]} />
      <h1 className="text-4xl font-bold tracking-tighter mb-2">Site Compare</h1>
      <p className="text-gray-400 mb-8">
        Side-by-side scores via <code className="text-[#5BC0BE]">?a=</code> &amp; <code className="text-[#5BC0BE]">?b=</code> site IDs.
      </p>

      {loading && <p className="text-gray-500">Loading dataset…</p>}

      {!loading && (!idA || !idB) && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-sm">
          <p>Provide two site IDs, e.g. <Link href="/compare?a=G10161&b=G12147" className="text-[#FF8C00] hover:underline">/compare?a=G10161&amp;b=G12147</Link></p>
        </div>
      )}

      {!loading && idA && idB && (!sites.a || !sites.b) && (
        <p className="text-red-400">One or both sites not found. Check IDs from the map panel or sites browser.</p>
      )}

      {sites.a && sites.b && (
        <>
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {[sites.a, sites.b].map((s, i) => (
              <div key={s.id} className="rounded-2xl border border-white/10 p-5 bg-white/[0.03]">
                <div className="text-xs text-gray-500 mb-1">Site {i === 0 ? 'A' : 'B'}</div>
                <h2 className="text-lg font-semibold truncate">{s.properties.name || s.id}</h2>
                <div className="mt-2 flex items-center gap-2">
                  <span className={`stranded-score ${scoreTierClass(s.strandedScore)}`}>{s.strandedScore}</span>
                  <span className="text-xs text-gray-400">{s.properties.province}</span>
                </div>
                <Link href={`/map?site=${s.id}`} className="text-xs text-[#5BC0BE] hover:underline mt-3 inline-block">Open on map →</Link>
              </div>
            ))}
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-gray-500">
                  <th className="p-4">Metric</th>
                  <th className="p-4 text-[#FF8C00]">{sites.a.properties.name?.slice(0, 24) || 'A'}</th>
                  <th className="p-4 text-[#5BC0BE]">{sites.b.properties.name?.slice(0, 24) || 'B'}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <tr key={row.label} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="p-4 text-gray-400">{row.label}</td>
                    <td className="p-4 font-mono tabular-nums">{row.a}</td>
                    <td className="p-4 font-mono tabular-nums">{row.b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <details className="mt-6 rounded-xl border border-white/10 p-4">
            <summary className="text-sm font-semibold text-[#FF8C00] cursor-pointer">Score factor breakdown</summary>
            <div className="grid md:grid-cols-2 gap-4 mt-4 text-xs">
              {[sites.a, sites.b].map(s => {
                const ex = explainStrandedScore(s)
                return (
                  <div key={s.id}>
                    <div className="font-medium mb-2">{s.properties.name}</div>
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