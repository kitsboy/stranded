'use client'

import { useEffect, useMemo, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Breadcrumbs from '@/components/Breadcrumbs'
import { loadSites, EnrichedSite } from '@/lib/sites'

function ProvincesContent() {
  const searchParams = useSearchParams()
  const selected = searchParams.get('name') || ''
  const [sites, setSites] = useState<EnrichedSite[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadSites().then(s => { setSites(s); setLoading(false) }) }, [])

  const provinces = useMemo(() => {
    const m: Record<string, EnrichedSite[]> = {}
    sites.forEach(s => {
      const p = s.properties.province || 'Unknown'
      if (!m[p]) m[p] = []
      m[p].push(s)
    })
    return Object.entries(m).map(([name, list]) => ({
      name,
      count: list.length,
      totalEmission: list.reduce((a, x) => a + x.emission, 0),
      avgScore: +(list.reduce((a, x) => a + x.strandedScore, 0) / list.length).toFixed(1),
      top: [...list].sort((a, b) => b.strandedScore - a.strandedScore)[0],
    })).sort((a, b) => b.count - a.count)
  }, [sites])

  const filtered = selected ? sites.filter(s => s.properties.province === selected).sort((a, b) => b.strandedScore - a.strandedScore).slice(0, 20) : []

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Dashboard', href: '/dashboard' }, { label: selected || 'Provinces' }]} />
      <h1 className="text-4xl font-bold tracking-tighter mb-2">Provincial Intelligence</h1>
      <p className="text-gray-400 mb-8">{provinces.length} provinces & territories · click for top sites</p>

      {loading ? <div className="text-gray-400">Loading…</div> : (
        <>
          <div className="grid md:grid-cols-3 gap-4 mb-10">
            {provinces.map(p => (
              <Link key={p.name} href={`/provinces?name=${encodeURIComponent(p.name)}`} className={`rounded-2xl border p-5 transition hover:border-[#FF8C00]/50 ${selected === p.name ? 'border-[#FF8C00] bg-[#FF8C00]/5' : 'border-white/10 bg-white/[0.03]'}`}>
                <div className="font-semibold text-lg">{p.name}</div>
                <div className="text-3xl font-bold text-[#FF8C00] mt-1">{p.count}</div>
                <div className="text-xs text-gray-400 mt-2">{p.totalEmission.toLocaleString()} kg/day · avg score {p.avgScore}</div>
              </Link>
            ))}
          </div>

          {selected && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Top sites in {selected}</h2>
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