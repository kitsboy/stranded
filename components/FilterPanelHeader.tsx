'use client'

import { ChevronDown, ChevronUp, Filter, RefreshCw } from 'lucide-react'
import { useLocale } from '@/lib/useLocale'
import { tf } from '@/lib/i18n'

type FilterPanelHeaderProps = {
  activeFilterCount: number
  filtersCollapsed: boolean
  onToggleCollapse: () => void
  onResetFilters: () => void
}

export default function FilterPanelHeader({
  activeFilterCount,
  filtersCollapsed,
  onToggleCollapse,
  onResetFilters,
}: FilterPanelHeaderProps) {
  const { locale, t } = useLocale()

  return (
    <div className="map-filter-header sticky top-0 z-10 px-5 pt-5 pb-3 bg-[var(--glass)] backdrop-blur-xl border-b border-white/10 rounded-t-3xl">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[#FF8C00] font-semibold tracking-widest text-xs min-w-0">
          <Filter size={16} className="shrink-0" aria-hidden />
          <span className="truncate">{t('mapFiltersLive')}</span>
          {activeFilterCount > 0 && (
            <span
              className="shrink-0 px-1.5 py-px rounded-full text-[9px] font-bold bg-[#FF8C00] text-black"
              data-testid="filter-panel-active-count"
            >
              {activeFilterCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onToggleCollapse}
            className="text-[10px] flex items-center gap-0.5 text-gray-400 hover:text-white min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 justify-center"
            aria-expanded={!filtersCollapsed}
            aria-controls="map-filter-panel-body"
            aria-label={filtersCollapsed ? t('mapExpandFilters') : t('mapCollapseFilters')}
          >
            {filtersCollapsed ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
          </button>
          <button
            type="button"
            onClick={onResetFilters}
            className="text-[10px] flex items-center gap-1 text-gray-400 hover:text-white min-h-[44px] px-2 sm:min-h-0"
          >
            <RefreshCw size={13} aria-hidden /> {t('mapReset')}
          </button>
        </div>
      </div>
      {activeFilterCount > 0 && (
        <div className="text-[9px] text-gray-500 mt-1">
          {tf(locale, 'mapFiltersActive', { count: String(activeFilterCount) })}
        </div>
      )}
    </div>
  )
}