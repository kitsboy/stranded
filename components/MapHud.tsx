'use client'

import { Target } from 'lucide-react'
import { useLocale } from '@/lib/useLocale'
import { tf } from '@/lib/i18n'

type MapHudProps = {
  filteredCount: number
  totalCount: number
  activeFilterCount: number
  liveBtcPrice: number
  missionDailyCad?: number
  onResetFilters: () => void
  onGeolocate: () => void
}

export default function MapHud({
  filteredCount,
  totalCount,
  activeFilterCount,
  liveBtcPrice,
  missionDailyCad,
  onResetFilters,
  onGeolocate,
}: MapHudProps) {
  const { locale, t } = useLocale()

  return (
    <div
      className="map-top-hud absolute top-3 left-1/2 -translate-x-1/2 z-[70] flex items-center justify-center text-xs no-print"
      data-testid="map-hud"
    >
      <div className="map-top-hud__inner glass rounded-2xl flex items-center border border-white/10">
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <Target size={15} className="text-[#FF8C00]" aria-hidden />
          <span className="font-mono text-[#FF8C00] tabular-nums">{filteredCount.toLocaleString()}</span>
          <span className="text-gray-400">
            / {totalCount.toLocaleString()} {t('mapHudVisibleSuffix')}
          </span>
          {filteredCount < totalCount && totalCount > 0 && (
            <button
              type="button"
              onClick={onResetFilters}
              className="ml-2 px-2 py-0.5 text-[10px] rounded bg-[#FF8C00] text-black font-medium hover:bg-orange-400"
            >
              {t('mapShowAll')}
            </button>
          )}
          {activeFilterCount > 0 && (
            <span
              className="ml-1 px-2 py-0.5 text-[10px] rounded-full bg-[#5BC0BE]/15 border border-[#5BC0BE]/40 text-[#5BC0BE] font-medium"
              data-testid="hud-active-filter-count"
            >
              {tf(locale, 'mapActiveFilters', { count: String(activeFilterCount) })}
            </span>
          )}
        </div>
        <div className="map-top-hud__divider h-3 w-px bg-white/20 shrink-0" aria-hidden />
        <button
          type="button"
          data-testid="geolocate-btn"
          onClick={onGeolocate}
          className="text-[10px] px-2 py-0.5 rounded-full border border-[#5BC0BE]/40 text-[#5BC0BE] hover:bg-[#5BC0BE]/10 shrink-0"
          aria-label={t('mapGeolocate')}
        >
          {t('mapGeolocate')}
        </button>
        <div className="map-top-hud__divider h-3 w-px bg-white/20 shrink-0" aria-hidden />
        <div className="shrink-0">
          BTC <span className="btc-ticker font-semibold text-emerald-400">${liveBtcPrice.toLocaleString()}</span>
        </div>
        {missionDailyCad != null && missionDailyCad > 0 && (
          <>
            <div className="map-top-hud__divider h-3 w-px bg-white/20 shrink-0" aria-hidden />
            <div className="text-[#FF8C00] font-medium shrink-0">
              {tf(locale, 'mapMissionDay', { amount: missionDailyCad.toLocaleString() })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}