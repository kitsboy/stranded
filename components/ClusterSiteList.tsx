'use client'

import { useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { rankClusterSites, clusterSummary, type ClusterListItem } from '@/lib/cluster-list'
import { scoreTierClass } from '@/lib/scoring'

type Props = {
  items: ClusterListItem[]
  title?: string
  onClose: () => void
  onSelect: (id: string) => void
}

export default function ClusterSiteList({ items, title = 'Cluster sites', onClose, onSelect }: Props) {
  const [sort, setSort] = useState<'score' | 'emission' | 'name'>('score')
  const ranked = useMemo(() => rankClusterSites(items, sort), [items, sort])
  const summary = useMemo(() => clusterSummary(items), [items])

  return (
    <div
      className="absolute bottom-14 left-3 z-[70] w-[min(340px,92vw)] max-h-[50vh] overflow-hidden rounded-2xl border border-white/15 bg-[#0f172a]/95 shadow-2xl backdrop-blur flex flex-col"
      data-testid="cluster-site-list"
      role="dialog"
      aria-label={title}
    >
      <div className="flex items-start justify-between gap-2 border-b border-white/10 px-3 py-2.5">
        <div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <p className="text-[10px] text-gray-400">
            {summary.count} sites · avg score {summary.avgScore} · {Math.round(summary.totalEmission).toLocaleString()} kg/day
          </p>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-white/10 hover:text-white" aria-label="Close cluster list">
          <X size={16} />
        </button>
      </div>
      <div className="flex gap-1 px-3 py-2 border-b border-white/5">
        {(['score', 'emission', 'name'] as const).map(s => (
          <button
            key={s}
            type="button"
            onClick={() => setSort(s)}
            className={`rounded-md px-2 py-1 text-[10px] capitalize ${sort === s ? 'bg-[#5BC0BE]/20 text-[#5BC0BE]' : 'text-gray-400 hover:bg-white/5'}`}
          >
            {s}
          </button>
        ))}
      </div>
      <ul className="overflow-y-auto flex-1 p-2 space-y-1">
        {ranked.map(item => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onSelect(item.id)}
              className="w-full text-left rounded-xl px-2.5 py-2 hover:bg-white/5 border border-transparent hover:border-white/10 transition"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-white truncate">{item.name}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${scoreTierClass(item.score)}`}>{item.score}</span>
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">
                {item.province || '—'} · {Math.round(item.emission).toLocaleString()} kg/day
                {item.distanceKm != null && <> · {item.distanceKm.toFixed(1)} km</>}
              </div>
            </button>
          </li>
        ))}
        {!ranked.length && <li className="text-xs text-gray-500 p-3">No sites in this cluster.</li>}
      </ul>
    </div>
  )
}
