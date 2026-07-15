'use client'

import { X } from 'lucide-react'
import type { MapFilterChip } from '@/lib/map-filters'
import { useLocale } from '@/lib/useLocale'

type MapFilterSummaryProps = {
  chips: MapFilterChip[]
}

export default function MapFilterSummary({ chips }: MapFilterSummaryProps) {
  const { t } = useLocale()
  if (!chips.length) return null

  return (
    <div
      className="px-5 py-2 border-b border-white/10 bg-black/15"
      data-testid="map-filter-summary"
      aria-label={t('mapFilterSummary')}
    >
      <div className="text-[9px] uppercase tracking-widest text-gray-500 mb-1.5">{t('mapFilterSummary')}</div>
      <div className="flex flex-wrap gap-1.5">
        {chips.map(chip => (
          <button
            key={chip.id}
            type="button"
            onClick={chip.onRemove}
            className="group inline-flex items-center gap-1 max-w-full text-[10px] px-2 py-0.5 rounded-full border border-[#5BC0BE]/35 text-[#5BC0BE] bg-[#5BC0BE]/10 hover:bg-[#5BC0BE]/20 transition"
            title={t('mapRemoveFilter')}
          >
            <span className="truncate">{chip.label}</span>
            <X size={10} className="shrink-0 opacity-70 group-hover:opacity-100" aria-hidden />
          </button>
        ))}
      </div>
    </div>
  )
}