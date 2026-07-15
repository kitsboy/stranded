'use client'

import { useEffect } from 'react'
import { X, Filter } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import FocusTrap from '@/components/FocusTrap'
import { useLocale } from '@/lib/useLocale'

type Props = {
  open: boolean
  onClose: () => void
  children: React.ReactNode
}

export default function MobileFilterDrawer({ open, onClose, children }: Props) {
  const { t } = useLocale()

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[85] xl:hidden" role="presentation" data-testid="mobile-filters-drawer">
          <motion.button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            aria-label={t('mapCloseFilters')}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className="absolute inset-y-0 left-0 w-[min(320px,92vw)] flex flex-col"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            drag="x"
            dragConstraints={{ left: -280, right: 0 }}
            dragElastic={0.08}
            onDragEnd={(_, info) => {
              if (info.offset.x < -72 || info.velocity.x < -420) onClose()
            }}
          >
            <FocusTrap active onEscape={onClose} className="h-full flex flex-col glass border-r border-white/10 shadow-2xl">
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-2 text-[#FF8C00] font-semibold tracking-widest text-xs">
                  <Filter size={16} aria-hidden />
                  {t('mapFiltersLive')}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
                  aria-label={t('mapCloseFilters')}
                >
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-4 map-filter-scroll" data-autofocus tabIndex={-1}>
                {children}
              </div>
            </FocusTrap>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}