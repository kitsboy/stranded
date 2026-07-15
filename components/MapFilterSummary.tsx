'use client'

import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { MapFilterChip } from '@/lib/map-filters'
import { useLocale } from '@/lib/useLocale'
import { useReducedMotion } from '@/lib/useReducedMotion'

type MapFilterSummaryProps = {
  chips: MapFilterChip[]
}

const chipMotion = {
  initial: { opacity: 0, scale: 0.88, x: -6 },
  animate: { opacity: 1, scale: 1, x: 0 },
  exit: { opacity: 0, scale: 0.82, x: 8, transition: { duration: 0.16 } },
}

export default function MapFilterSummary({ chips }: MapFilterSummaryProps) {
  const { t } = useLocale()
  const reducedMotion = useReducedMotion()
  if (!chips.length) return null

  const transition = reducedMotion
    ? { duration: 0 }
    : { type: 'spring' as const, stiffness: 520, damping: 34 }

  return (
    <div
      className="px-5 py-2 border-b border-white/10 bg-black/15"
      data-testid="map-filter-summary"
      aria-label={t('mapFilterSummary')}
    >
      <div className="text-[9px] uppercase tracking-widest text-gray-500 mb-1.5">{t('mapFilterSummary')}</div>
      <div className="flex flex-wrap gap-1.5">
        <AnimatePresence mode="popLayout" initial={false}>
          {chips.map(chip => (
            <motion.button
              key={chip.id}
              type="button"
              layout={!reducedMotion}
              initial={reducedMotion ? false : chipMotion.initial}
              animate={chipMotion.animate}
              exit={reducedMotion ? undefined : chipMotion.exit}
              transition={transition}
              onClick={chip.onRemove}
              className="group inline-flex items-center gap-1 max-w-full text-[10px] px-2.5 py-1 min-h-[32px] sm:min-h-0 rounded-full border border-[#5BC0BE]/35 text-[#5BC0BE] bg-[#5BC0BE]/10 hover:bg-[#5BC0BE]/20 active:scale-[0.94] active:bg-[#5BC0BE]/30 transition-[background-color,transform] touch-manipulation"
              title={t('mapRemoveFilter')}
              data-testid={`filter-chip-${chip.id}`}
            >
              <span className="truncate">{chip.label}</span>
              <X size={10} className="shrink-0 opacity-70 group-hover:opacity-100 group-active:scale-110 transition" aria-hidden />
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}