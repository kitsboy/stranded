'use client'

import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'
import { getRecentSites, type RecentSiteEntry } from '@/lib/recent-sites'

type RecentSitesProps = {
  onSelect?: (entry: RecentSiteEntry) => void
  compact?: boolean
  max?: number
}

export default function RecentSites({ onSelect, compact = false, max = 5 }: RecentSitesProps) {
  const [recent, setRecent] = useState<RecentSiteEntry[]>([])

  useEffect(() => {
    setRecent(getRecentSites().slice(0, max))
    const refresh = () => setRecent(getRecentSites().slice(0, max))
    window.addEventListener('stranded-recent-updated', refresh)
    return () => window.removeEventListener('stranded-recent-updated', refresh)
  }, [max])

  if (!recent.length) return null

  if (compact) {
    return (
      <div>
        <div className="text-[10px] text-gray-400 mb-2 flex items-center gap-1" data-testid="cmd-recent-sites">
          <Clock size={11} /> RECENT SITES
        </div>
        <div className="flex flex-wrap gap-1.5">
        {recent.map(r => (
          <button
            key={r.id}
            type="button"
            onClick={() => onSelect?.(r)}
            className="text-[10px] px-2 py-1 rounded-full border border-white/15 hover:border-[#5BC0BE]/40 text-gray-300 truncate max-w-[140px]"
            title={`${r.name} · ${r.province}`}
          >
            {r.name}
          </button>
        ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="text-[10px] text-gray-400 mb-2 flex items-center gap-1" data-testid="cmd-recent-sites">
        <Clock size={11} /> RECENT SITES
      </div>
      <div className="flex flex-wrap gap-2">
        {recent.map(r => (
          <button
            key={r.id}
            type="button"
            onClick={() => onSelect?.(r)}
            className="text-xs px-2 py-1 bg-white/5 hover:bg-[#5BC0BE]/15 rounded border border-white/10 truncate max-w-[160px]"
            title={r.province}
          >
            {r.name}
            <span className="text-gray-500 ml-1">· {r.score}</span>
          </button>
        ))}
      </div>
    </div>
  )
}