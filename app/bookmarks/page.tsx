'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Breadcrumbs from '@/components/Breadcrumbs'
import { getBookmarks } from '@/lib/bookmarks'
import { loadSites, EnrichedSite } from '@/lib/sites'
import { Star } from 'lucide-react'

export default function BookmarksPage() {
  const [sites, setSites] = useState<EnrichedSite[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([loadSites(), Promise.resolve(getBookmarks())]).then(([all, ids]) => {
      setSites(ids.map(id => all.find(s => s.id === id)).filter(Boolean) as EnrichedSite[])
      setLoading(false)
    })
  }, [])

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Bookmarks' }]} />
      <h1 className="text-4xl font-bold tracking-tighter mb-2 flex items-center gap-2">
        <Star className="text-[#FF8C00]" size={28} /> Saved Sites
      </h1>
      <p className="text-gray-400 mb-8">Starred locations stored locally on this device.</p>

      {loading && <p className="text-gray-500">Loading…</p>}
      {!loading && sites.length === 0 && (
        <p className="text-gray-400">No bookmarks yet. Star sites from the map panel.</p>
      )}
      <ul className="space-y-2">
        {sites.map(s => (
          <li key={s.id}>
            <Link href={`/map?site=${s.id}`} className="flex justify-between items-center p-4 rounded-xl border border-white/10 hover:border-[#FF8C00]/40 bg-white/[0.02]">
              <div>
                <div className="font-medium">{s.properties.name || s.id}</div>
                <div className="text-xs text-gray-500">{s.properties.province} · score {s.strandedScore}</div>
              </div>
              <span className="font-mono text-[#5BC0BE] text-sm">{s.emission.toLocaleString()} kg/d</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}