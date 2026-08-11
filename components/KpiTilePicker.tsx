'use client'

import { useEffect, useState } from 'react'
import {
  getSelectedKpis,
  listAvailableKpis,
  setSelectedKpis,
  type KpiId,
} from '@/lib/kpi-preferences'

export default function KpiTilePicker({
  onChange,
  className = '',
}: {
  onChange?: (ids: KpiId[]) => void
  className?: string
}) {
  const [selected, setSelected] = useState<KpiId[]>([])
  const available = listAvailableKpis()

  useEffect(() => {
    setSelected(getSelectedKpis())
  }, [])

  const toggle = (id: KpiId) => {
    setSelected(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      const final = next.length ? next : prev
      setSelectedKpis(final)
      onChange?.(final)
      return final
    })
  }

  return (
    <div className={`rounded-2xl border border-white/10 bg-white/[0.03] p-5 ${className}`} data-testid="kpi-tile-picker">
      <h3 className="font-semibold text-[#5BC0BE] mb-2 text-sm">KPI tiles</h3>
      <p className="text-[10px] text-gray-500 mb-3">Choose which metrics matter on your command center.</p>
      <div className="flex flex-wrap gap-1.5">
        {available.map(k => {
          const on = selected.includes(k.id)
          return (
            <button
              key={k.id}
              type="button"
              onClick={() => toggle(k.id)}
              className={`rounded-full px-2.5 py-1 text-[11px] border transition ${
                on
                  ? 'border-[#5BC0BE]/50 bg-[#5BC0BE]/15 text-[#5BC0BE]'
                  : 'border-white/10 text-gray-400 hover:border-white/25'
              }`}
            >
              {k.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
