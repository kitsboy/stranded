'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Breadcrumbs from '@/components/Breadcrumbs'
import { getBookmarkEntries, getBookmarkTags, setBookmarkTag, exportBookmarksJson, importBookmarksJson } from '@/lib/bookmarks'
import { toast } from 'sonner'
import { loadSites, EnrichedSite } from '@/lib/sites'
import { Star } from 'lucide-react'

export default function BookmarksPage() {
  const [sites, setSites] = useState<(EnrichedSite & { tag?: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [filterTag, setFilterTag] = useState<string>('all')
  const [tags, setTags] = useState<string[]>([])

  const refresh = () => {
    const entries = getBookmarkEntries()
    setTags(getBookmarkTags())
    loadSites().then(all => {
      setSites(
        entries
          .map(e => {
            const s = all.find(x => x.id === e.siteId)
            return s ? { ...s, tag: e.tag } : null
          })
          .filter(Boolean) as (EnrichedSite & { tag?: string })[],
      )
      setLoading(false)
    })
  }

  useEffect(() => { refresh() }, [])

  const filtered = useMemo(() => {
    if (filterTag === 'all') return sites
    if (filterTag === 'untagged') return sites.filter(s => !s.tag)
    return sites.filter(s => s.tag === filterTag)
  }, [sites, filterTag])

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Bookmarks' }]} />
      <h1 className="text-4xl font-bold tracking-tighter mb-2 flex items-center gap-2">
        <Star className="text-[#FF8C00]" size={28} /> Saved Sites
      </h1>
      <p className="text-gray-400 mb-6">Starred locations stored locally on this device. Optional folder tags for grouping.</p>

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          type="button"
          onClick={() => {
            const blob = new Blob([exportBookmarksJson()], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `stranded-bookmarks-${new Date().toISOString().slice(0, 10)}.json`
            a.click()
            URL.revokeObjectURL(url)
            toast.success('Bookmarks exported')
          }}
          className="text-xs px-3 py-1.5 rounded-lg border border-[#FF8C00]/40 text-[#FF8C00] hover:bg-[#FF8C00]/10"
        >
          Export JSON
        </button>
        <label className="text-xs px-3 py-1.5 rounded-lg border border-[#5BC0BE]/40 text-[#5BC0BE] hover:bg-[#5BC0BE]/10 cursor-pointer">
          Import JSON
          <input
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={async e => {
              const file = e.target.files?.[0]
              if (!file) return
              try {
                const r = importBookmarksJson(await file.text())
                toast.success(`Imported ${r.bookmarks} bookmarks, ${r.notes} notes, ${r.presets} presets`)
                refresh()
              } catch {
                toast.error('Invalid bookmarks file')
              }
            }}
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {['all', 'untagged', ...tags].map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setFilterTag(t)}
            className={`text-xs px-3 py-1.5 rounded-full border ${filterTag === t ? 'border-[#FF8C00] bg-[#FF8C00]/15 text-[#FF8C00]' : 'border-white/15 text-gray-400 hover:border-white/30'}`}
          >
            {t === 'all' ? 'All' : t === 'untagged' ? 'Untagged' : t}
          </button>
        ))}
      </div>

      {loading && <p className="text-gray-500">Loading…</p>}
      {!loading && sites.length === 0 && (
        <p className="text-gray-400">No bookmarks yet. Star sites from the map panel.</p>
      )}
      <ul className="space-y-2">
        {filtered.map(s => (
          <li key={s.id} className="p-4 rounded-xl border border-white/10 hover:border-[#FF8C00]/40 bg-white/[0.02]">
            <div className="flex justify-between items-start gap-3">
              <Link href={`/map?site=${s.id}`} className="flex-1 min-w-0">
                <div className="font-medium truncate">{s.properties.name || s.id}</div>
                <div className="text-xs text-gray-500">{s.properties.province} · score {s.strandedScore}</div>
              </Link>
              <span className="font-mono text-[#5BC0BE] text-sm shrink-0">{s.emission.toLocaleString()} kg/d</span>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <label className="text-[10px] text-gray-500 uppercase">Tag</label>
              <input
                type="text"
                defaultValue={s.tag || ''}
                placeholder="e.g. diligence, ab-oil"
                onBlur={e => { setBookmarkTag(s.id, e.target.value); refresh() }}
                className="flex-1 text-xs bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white"
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}