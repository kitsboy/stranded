'use client'

import { FilterX, RefreshCw } from 'lucide-react'
import { motion } from 'framer-motion'
import { useLocale } from '@/lib/useLocale'
import { useReducedMotion } from '@/lib/useReducedMotion'

type MapEmptyStateProps = {
  onResetFilters: () => void
}

export default function MapEmptyState({ onResetFilters }: MapEmptyStateProps) {
  const { t } = useLocale()
  const reducedMotion = useReducedMotion()

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={reducedMotion ? undefined : { opacity: 0, scale: 0.96 }}
      transition={reducedMotion ? { duration: 0 } : { duration: 0.22 }}
      className="absolute inset-0 z-[55] flex items-center justify-center pointer-events-none px-6"
      data-testid="map-empty-state"
      role="status"
      aria-live="polite"
    >
      <div className="glass max-w-sm w-full rounded-2xl border border-[#FF8C00]/35 px-6 py-5 text-center shadow-2xl pointer-events-auto">
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#FF8C00]/15 border border-[#FF8C00]/30">
          <FilterX size={20} className="text-[#FF8C00]" aria-hidden />
        </div>
        <h3 className="text-sm font-semibold text-white mb-1">{t('mapEmptyTitle')}</h3>
        <p className="text-xs text-gray-400 leading-relaxed mb-4">{t('mapEmptyHint')}</p>
        <button
          type="button"
          onClick={onResetFilters}
          className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-4 py-2.5 min-h-[44px] rounded-xl bg-[#FF8C00] text-black hover:bg-orange-400 active:scale-[0.97] transition touch-manipulation"
          data-testid="map-empty-reset"
        >
          <RefreshCw size={13} aria-hidden />
          {t('mapEmptyReset')}
        </button>
      </div>
    </motion.div>
  )
}