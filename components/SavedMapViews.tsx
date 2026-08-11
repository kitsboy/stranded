'use client'

import { useEffect, useState } from 'react'
import { deleteView, listSavedViews, saveView, type SavedMapView } from '@/lib/saved-map-views'
import { toast } from 'sonner'

type Props = {
  getCurrentState: () => SavedMapView['state']
  onLoad: (state: SavedMapView['state']) => void
  className?: string
}

export default function SavedMapViews({ getCurrentState, onLoad, className = '' }: Props) {
  const [views, setViews] = useState<SavedMapView[]>([])
  const [name, setName] = useState('')

  const refresh = () => setViews(listSavedViews())

  useEffect(() => {
    refresh()
  }, [])

  const onSave = () => {
    const n = name.trim() || `View ${new Date().toLocaleDateString()}`
    saveView(n, getCurrentState())
    setName('')
    refresh()
    toast.success('Map view saved')
  }

  return (
    <div className={`rounded-xl border border-white/10 p-3 ${className}`} data-testid="saved-map-views">
      <div className="text-[10px] uppercase tracking-widest text-gray-400 mb-2">Saved views</div>
      <div className="flex gap-1 mb-2">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Name this view"
          className="flex-1 rounded-lg bg-black/30 border border-white/10 px-2 py-1 text-xs"
          aria-label="Saved view name"
        />
        <button type="button" onClick={onSave} className="rounded-lg bg-[#5BC0BE]/20 text-[#5BC0BE] px-2 py-1 text-xs">
          Save
        </button>
      </div>
      <ul className="space-y-1 max-h-32 overflow-y-auto">
        {views.map(v => (
          <li key={v.id} className="flex items-center gap-1 text-xs">
            <button type="button" className="flex-1 text-left truncate hover:text-[#5BC0BE]" onClick={() => onLoad(v.state)}>
              {v.name}
            </button>
            <button
              type="button"
              className="text-gray-500 hover:text-red-300 px-1"
              onClick={() => {
                deleteView(v.id)
                refresh()
              }}
              aria-label={`Delete ${v.name}`}
            >
              ×
            </button>
          </li>
        ))}
        {!views.length && <li className="text-[10px] text-gray-500">No saved views yet</li>}
      </ul>
    </div>
  )
}
